'use client';

import React, { useState } from 'react';
import { Button } from '@/components/common/ui';
import AdminReports from '../reports/AdminReports';
import AdminEmployees from '../employees/AdminEmployees';
import AdminRewardCatalog from '../rewards/AdminRewardCatalog';
import AdminQuotas from './AdminQuotas';
import AdminNews from './AdminNews';
import { KPIReport } from '@/types';
import { LogOut, Home } from 'lucide-react';
import Link from 'next/link';

interface AdminShellProps {
    report: KPIReport;
    refreshData: () => void;
}

const AdminShell: React.FC<AdminShellProps> = ({ report, refreshData }) => {
    const [activeTab, setActiveTab] = useState<'REPORTS' | 'EMPLOYEES' | 'REWARDS' | 'QUOTAS' | 'NEWS'>('REPORTS');

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Admin Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center h-16">
                        {['REPORTS', 'EMPLOYEES', 'REWARDS', 'QUOTAS', 'NEWS'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-4 py-3 font-bold text-sm transition-all border-b-4 whitespace-nowrap ${activeTab === tab
                                    ? 'border-[#DA291C] text-[#DA291C] bg-red-50'
                                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-7xl mx-auto">
                    {activeTab === 'REPORTS' && <AdminReports />}
                    {activeTab === 'EMPLOYEES' && <AdminEmployees />}
                    {activeTab === 'REWARDS' && <AdminRewardCatalog />}
                    {activeTab === 'QUOTAS' && <AdminQuotas />}
                    {activeTab === 'NEWS' && <AdminNews />}
                </div>
            </div>
        </div>
    );
};

export default AdminShell;
