import React, { useState } from 'react';
import { ReportFilters } from '../../components/admin/reports/ReportFilters';
import { EmployeePointsReport } from '../../components/admin/reports/EmployeePointsReport';
import { RewardRedemptionReport } from '../../components/admin/reports/RewardRedemptionReport';
import { GiverSummaryReport } from '../../components/admin/reports/GiverSummaryReport';
import { ReportFilter } from '../../types/reports';
import { FileText, Gift, Users } from 'lucide-react';

const Reports: React.FC = () => {
    // Filter State
    const [filter, setFilter] = useState<ReportFilter>({
        startDate: '',
        endDate: '',
        businessUnit: '',
        department: '',
        branch: '',
        search: ''
    });

    // Tab State
    const [activeTab, setActiveTab] = useState<'points' | 'redemption' | 'giver'>('points');

    return (
        <div className="max-w-7xl mx-auto space-y-8 p-6 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900">Analytics & Reports</h1>
                <p className="text-gray-500 mt-2">Deep dive into engagement metrics, rewards distribution, and top performers.</p>
            </div>

            {/* Filter Section */}
            <ReportFilters filter={filter} onChange={setFilter} />

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('points')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                            ${activeTab === 'points'
                                ? 'border-brand-yellow text-brand-dark font-bold'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                    >
                        <Users size={18} />
                        Employee Points Summary
                    </button>
                    <button
                        onClick={() => setActiveTab('redemption')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                            ${activeTab === 'redemption'
                                ? 'border-brand-red text-brand-red font-bold'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                    >
                        <Gift size={18} />
                        Reward Redemption
                    </button>
                    <button
                        onClick={() => setActiveTab('giver')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                            ${activeTab === 'giver'
                                ? 'border-brand-dark text-brand-dark font-bold'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                    >
                        <FileText size={18} />
                        Giver Activity
                    </button>
                </nav>
            </div>

            {/* Content */}
            <div className="min-h-[500px]">
                {activeTab === 'points' && <EmployeePointsReport filter={filter} />}
                {activeTab === 'redemption' && <RewardRedemptionReport filter={filter} />}
                {activeTab === 'giver' && <GiverSummaryReport filter={filter} />}
            </div>
        </div>
    );
};

export default Reports;
