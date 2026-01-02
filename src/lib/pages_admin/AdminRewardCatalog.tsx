import React, { useState } from 'react';
import RewardList from '../../components/admin/rewards/RewardList';
import RedeemRequests from '../../components/admin/rewards/RedeemRequests';
import FulfillmentTable from '../../components/admin/rewards/FulfillmentTable';
import RewardHistory from '../../components/admin/rewards/RewardHistory';
import { Gift, FileText, Truck, List } from 'lucide-react';

const AdminRewardCatalog: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'catalog' | 'requests' | 'fulfillment' | 'history'>('catalog');

    const tabs = [
        { id: 'catalog', label: 'Catalog Management', icon: List },
        { id: 'requests', label: 'Redeem Requests', icon: Gift },
        { id: 'fulfillment', label: 'Fulfillment & Shipping', icon: Truck },
        { id: 'history', label: 'History Logs', icon: FileText },
    ] as const;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Rewards Management</h1>
                <p className="text-gray-500">Manage reward items, approve requests, and track shipping.</p>

                <div className="flex gap-2 mt-6 border-b">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-brand-yellow text-brand-dark'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[500px]">
                {activeTab === 'catalog' && <RewardList />}
                {activeTab === 'requests' && <RedeemRequests />}
                {activeTab === 'fulfillment' && <FulfillmentTable />}
                {activeTab === 'history' && <RewardHistory />}
            </div>
        </div>
    );
};

export default AdminRewardCatalog;
