'use client';

import React, { useState, useEffect } from 'react';
import { Card, Badge, Button } from '@/components/common/ui';
import { useAuth } from '@/contexts/AuthContext';
import {
    Loader2,
    Package,
    Zap,
    Clock,
    CheckCircle,
    XCircle,
    Truck,
    MapPin,
    ShoppingBag,
    Copy,
    Building2,
    PackageCheck
} from 'lucide-react';

interface RedeemRequest {
    id: string;
    rewardId: string;
    rewardName: string;
    employeeCode: string;
    employeeName: string;
    businessUnit: string;
    department: string;
    branch: string;
    pointsUsed: number;
    requestedAt: string;
    status: string;
    shippingType: string;
    shippingAddress?: string;
    contactPhone?: string;
    shippingStatus: string;
    tracking?: {
        carrier: string;
        trackingNumber: string;
        shippedAt?: string;
        deliveredAt?: string;
    };
    digitalCode?: string;
    note?: string;
}

export default function RedeemHistoryPage() {
    const { user: currentUser } = useAuth();
    const [requests, setRequests] = useState<RedeemRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [confirmingIds, setConfirmingIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (currentUser) {
            fetchRedeemHistory();
        }
    }, [currentUser]);

    const fetchRedeemHistory = async () => {
        if (!currentUser) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/rewards/redeem?employeeId=${currentUser.id}`);
            if (!res.ok) throw new Error('Failed to fetch redeem history');
            const data = await res.json();
            setRequests(data);
        } catch (error) {
            console.error('Failed to fetch redeem history:', error);
        } finally {
            setLoading(false);
        }
    };

    const confirmDelivery = async (requestId: string) => {
        if (!currentUser) return;

        setConfirmingIds(prev => new Set([...prev, requestId]));

        try {
            const res = await fetch(`/api/rewards/redeem/${requestId}/confirm-delivery`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeId: currentUser.id })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to confirm delivery');
            }

            // Refresh the list
            await fetchRedeemHistory();
        } catch (error: any) {
            console.error('Failed to confirm delivery:', error);
            alert(error.message || 'ไม่สามารถยืนยันการรับของได้');
        } finally {
            setConfirmingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(requestId);
                return newSet;
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'approved': return 'bg-green-100 text-green-700';
            case 'rejected': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return <Clock size={14} />;
            case 'approved': return <CheckCircle size={14} />;
            case 'rejected': return <XCircle size={14} />;
            default: return <Clock size={14} />;
        }
    };

    const getShippingStatusColor = (status: string) => {
        switch (status.toLowerCase().replace('-', '_')) {
            case 'pending': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
            case 'processing': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'shipped': return 'bg-purple-50 text-purple-600 border-purple-200';
            case 'delivered': return 'bg-green-50 text-green-600 border-green-200';
            case 'not_required': return 'bg-gray-50 text-gray-500 border-gray-200';
            default: return 'bg-gray-50 text-gray-500 border-gray-200';
        }
    };

    const filteredRequests = requests.filter(r => {
        if (filter === 'all') return true;
        return r.status.toLowerCase() === filter;
    });

    if (!currentUser) return null;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Redeem History</h2>
                <p className="text-gray-500">Track your reward redemption requests</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-gray-800">
                        {requests.length}
                    </div>
                    <div className="text-xs text-gray-500 uppercase">Total Requests</div>
                </Card>
                <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                        {requests.filter(r => r.status.toLowerCase() === 'pending').length}
                    </div>
                    <div className="text-xs text-gray-500 uppercase">Pending</div>
                </Card>
                <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                        {requests.filter(r => r.status.toLowerCase() === 'approved').length}
                    </div>
                    <div className="text-xs text-gray-500 uppercase">Approved</div>
                </Card>
                <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">
                        {requests.filter(r => r.status.toLowerCase() === 'rejected').length}
                    </div>
                    <div className="text-xs text-gray-500 uppercase">Rejected</div>
                </Card>
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all capitalize ${filter === f
                            ? 'bg-white shadow text-[#DA291C]'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Request List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-gray-400" size={32} />
                </div>
            ) : filteredRequests.length === 0 ? (
                <Card className="p-12 text-center">
                    <ShoppingBag className="mx-auto mb-3 text-gray-300" size={48} />
                    <p className="text-gray-500">No redemption requests found</p>
                    <p className="text-sm text-gray-400 mt-1">
                        {filter === 'all'
                            ? "You haven't redeemed any rewards yet"
                            : `No ${filter} requests`}
                    </p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredRequests.map(req => (
                        <Card key={req.id} className="p-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                {/* Left: Reward Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getStatusColor(req.status)}`}>
                                            {getStatusIcon(req.status)}
                                            {req.status.toUpperCase()}
                                        </span>
                                        <span className="text-gray-400 text-xs">
                                            {new Date(req.requestedAt).toLocaleDateString('th-TH', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>

                                    <h4 className="font-bold text-gray-900 text-lg">{req.rewardName}</h4>

                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="text-[#DA291C] font-bold">
                                            -{req.pointsUsed.toLocaleString()} pts
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${req.shippingType === 'digital'
                                            ? 'bg-purple-100 text-purple-700'
                                            : req.shippingType === 'pickup'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {req.shippingType === 'digital' ? (
                                                <><Zap size={10} /> Digital</>
                                            ) : req.shippingType === 'pickup' ? (
                                                <><Building2 size={10} /> Pickup</>
                                            ) : (
                                                <><Package size={10} /> Delivery</>
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {/* Right: Shipping Status or Digital Code */}
                                {req.status.toLowerCase() === 'approved' && req.shippingType === 'digital' && req.digitalCode && (
                                    <div className="md:text-right">
                                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                            <div className="text-xs text-purple-600 font-medium mb-1">รหัส/ลิงก์ของคุณ:</div>
                                            <div className="flex items-center gap-2">
                                                <code className="bg-white px-2 py-1 rounded text-sm font-mono text-purple-800 break-all">
                                                    {req.digitalCode}
                                                </code>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(req.digitalCode!);
                                                        alert('คัดลอกแล้ว!');
                                                    }}
                                                    className="p-1 hover:bg-purple-100 rounded"
                                                    title="Copy"
                                                >
                                                    <Copy size={14} className="text-purple-600" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Right: Shipping Status with Confirm Button */}
                                {req.status.toLowerCase() === 'approved' && req.shippingType !== 'digital' && (
                                    <div className="md:text-right space-y-2">
                                        <div className={`inline-block px-3 py-2 rounded-lg border ${getShippingStatusColor(req.shippingStatus)}`}>
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                <Truck size={14} />
                                                <span className="capitalize">{req.shippingStatus.replace('_', ' ')}</span>
                                            </div>
                                            {req.tracking && (
                                                <div className="text-xs mt-1 opacity-80">
                                                    {req.tracking.carrier}: {req.tracking.trackingNumber}
                                                </div>
                                            )}
                                        </div>

                                        {/* Confirm Received Button - Only show when SHIPPED */}
                                        {req.shippingStatus.toLowerCase() === 'shipped' && (
                                            <div>
                                                <Button
                                                    size="sm"
                                                    variant="primary"
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                    onClick={() => confirmDelivery(req.id)}
                                                    disabled={confirmingIds.has(req.id)}
                                                >
                                                    {confirmingIds.has(req.id) ? (
                                                        <>
                                                            <Loader2 size={14} className="mr-1 animate-spin" />
                                                            Processing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <PackageCheck size={14} className="mr-1" />
                                                            Confirm Received
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Shipping Address */}
                            {req.shippingAddress && (
                                <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600 flex items-start gap-2">
                                    <MapPin size={14} className="mt-0.5 text-gray-400" />
                                    <div>
                                        <span>{req.shippingAddress}</span>
                                        {req.contactPhone && (
                                            <span className="text-gray-400 ml-2">• Tel: {req.contactPhone}</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Rejection Note */}
                            {req.status.toLowerCase() === 'rejected' && req.note && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                                        <strong>Reason:</strong> {req.note}
                                    </p>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

