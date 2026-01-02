'use client';

import React, { useEffect, useState } from 'react';
import { ReportFilter, RedemptionData } from '@/types/reports';
import { ReportsApi } from '@/services/reports';
import { ReportTable } from './ReportTable';
import { Chart } from './Charts';

interface Props {
    filter: ReportFilter;
}

export const RewardRedemptionReport: React.FC<Props> = ({ filter }) => {
    const [data, setData] = useState<RedemptionData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const res = await ReportsApi.getRewardRedemptions(filter);
            setData(res);
            setLoading(false);
        };
        fetch();
    }, [filter]);

    const handleExport = () => {
        const csv = [
            ['Date', 'Employee', 'Reward', 'Category', 'Points'],
            ...data.map(r => [r.date, r.employeeName, r.rewardName, r.category, r.pointsUsed])
        ].map(e => e.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'redemptions.csv';
        a.click();
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-700 mb-4">Redemption by Category</h3>
                    <Chart
                        type="pie"
                        data={Object.entries(data.reduce((acc: any, curr) => {
                            acc[curr.category] = (acc[curr.category] || 0) + 1;
                            return acc;
                        }, {})).map(([name, value]) => ({ name, value }))}
                        dataKey="value"
                        categoryKey="name"
                    />
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-700 mb-4">Top Rewards</h3>
                    <Chart
                        type="bar"
                        data={Object.entries(data.reduce((acc: any, curr) => {
                            acc[curr.rewardName] = (acc[curr.rewardName] || 0) + 1;
                            return acc;
                        }, {})).map(([name, value]) => ({ name, value })).sort((a: any, b: any) => b.value - a.value).slice(0, 5)}
                        dataKey="value"
                        categoryKey="name"
                        color="#DB0007"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-700 mb-4">Redemption Log</h3>
                <ReportTable<RedemptionData>
                    isLoading={loading}
                    data={data}
                    onExport={handleExport}
                    columns={[
                        { header: 'Date', accessor: item => new Date(item.date).toLocaleDateString() },
                        { header: 'Employee', accessor: 'employeeName' },
                        { header: 'Reward', accessor: 'rewardName', className: 'font-bold text-brand-dark' },
                        { header: 'Category', accessor: 'category' },
                        { header: 'Points Used', accessor: item => item.pointsUsed.toLocaleString(), className: 'text-right' },
                        { header: 'Branch', accessor: 'branch' },
                    ]}
                />
            </div>
        </div>
    );
};
