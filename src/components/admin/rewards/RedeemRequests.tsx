'use client';

import React, { useEffect, useState } from 'react';
import { RedemptionRequest, RedemptionStatus } from '@/types/rewards';
import { RewardsCatalogApi } from '@/services/rewardsCatalog';
import { Button } from '@/components/common/ui';
import { Check, X, Clock, Loader } from 'lucide-react';
import { useConfirm } from '@/components/common/ConfirmModal';

const RedeemRequests: React.FC = () => {
    const [requests, setRequests] = useState<RedemptionRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const { confirm } = useConfirm();

    const loadData = async () => {
        setLoading(true);
        const data = await RewardsCatalogApi.getRedemptions();
        // Filter to show active logic mostly, but let's show all grouped by status for now, 
        // prioritizing Pending
        setRequests(data.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()));
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const handleStatusUpdate = async (id: string, status: RedemptionStatus) => {
        const isApprove = status === RedemptionStatus.APPROVED;
        const confirmed = await confirm({
            title: isApprove ? 'Approve Request' : 'Reject Request',
            message: `Are you sure you want to ${isApprove ? 'approve' : 'reject'} this redemption request?`,
            variant: isApprove ? 'success' : 'danger',
            confirmText: isApprove ? 'Approve' : 'Reject',
            cancelText: 'Cancel'
        });
        if (!confirmed) return;
        await RewardsCatalogApi.updateRedemptionStatus(id, status, 'Admin'); // Hardcoded Admin for now
        loadData();
    };

    const pendingRequests = requests.filter(r => r.status === RedemptionStatus.PENDING);
    const historyRequests = requests.filter(r => r.status !== RedemptionStatus.PENDING);

    const RequestCard = ({ req }: { req: RedemptionRequest }) => (
        <div className="bg-white border rounded-lg p-4 mb-3 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${req.status === RedemptionStatus.PENDING ? 'bg-yellow-100 text-yellow-700' :
                        req.status === RedemptionStatus.APPROVED ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                        }`}>
                        {req.status}
                    </span>
                    <span className="text-gray-400 text-xs">{new Date(req.requestedAt).toLocaleDateString()}</span>
                </div>
                <h4 className="font-bold text-gray-900">{req.rewardName} <span className="text-gray-500 font-normal">({req.pointsUsed} pts)</span></h4>
                <p className="text-sm text-gray-600">
                    Requested by <span className="font-semibold">{req.employeeName}</span> ({req.employeeCode})
                </p>
                <p className="text-xs text-gray-500">{req.businessUnit} • {req.department}</p>
                {req.shippingAddress && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        🚚 Ship to: {req.shippingAddress} (Tel: {req.contactPhone})
                    </p>
                )}
            </div>

            {req.status === RedemptionStatus.PENDING && (
                <div className="flex gap-2 mt-2 md:mt-0">
                    <button
                        onClick={() => handleStatusUpdate(req.id, RedemptionStatus.REJECTED)}
                        className="px-3 py-1.5 rounded-md border border-red-200 text-red-600 text-sm hover:bg-red-50 flex items-center gap-1"
                    >
                        <X size={14} /> Reject
                    </button>
                    <button
                        onClick={() => handleStatusUpdate(req.id, RedemptionStatus.APPROVED)}
                        className="px-3 py-1.5 rounded-md bg-green-600 text-white text-sm hover:bg-green-700 flex items-center gap-1 shadow-sm"
                    >
                        <Check size={14} /> Approve
                    </button>
                </div>
            )}
        </div>
    );

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
        </div>
    );
};

export default RedeemRequests;
