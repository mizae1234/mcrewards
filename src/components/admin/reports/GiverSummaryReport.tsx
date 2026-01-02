'use client';

import React, { useEffect, useState } from 'react';
import { ReportFilter, GiverData } from '@/types/reports';
import { ReportsApi } from '@/services/reports';
import { ReportTable } from './ReportTable';
import { Chart } from './Charts';

interface Props {
    filter: ReportFilter;
}

export const GiverSummaryReport: React.FC<Props> = ({ filter }) => {
    const [data, setData] = useState<GiverData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const res = await ReportsApi.getGiverSummary(filter);
            setData(res);
            setLoading(false);
        };
        fetch();
    }, [filter]);

    const handleExport = () => {
        const csv = [
            ['ID', 'Name', 'Role', 'Given', 'Count', 'Avg'],
            ...data.map(r => [r.id, r.name, r.role, r.pointsGiven, r.transactionsCount, r.averagePoints])
        ].map(e => e.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'giver-summary.csv';
        a.click();
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-700 mb-4">Top Givers (Points)</h3>
                    <Chart
                        type="bar"
                        data={data.sort((a, b) => b.pointsGiven - a.pointsGiven).slice(0, 10)}
                        dataKey="pointsGiven"
                        categoryKey="name"
                        color="#DB0007"
                    />
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-700 mb-4">Given by Department</h3>
                    <Chart
                        type="pie"
                        data={Object.entries(data.reduce((acc: any, curr) => {
                            acc[curr.department] = (acc[curr.department] || 0) + curr.pointsGiven;
                            return acc;
                        }, {})).map(([name, value]) => ({ name, value }))}
                        dataKey="value"
                        categoryKey="name"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-700 mb-4">Manager Performance</h3>
                <ReportTable<GiverData>
                    isLoading={loading}
                    data={data}
                    onExport={handleExport}
                    columns={[
                        {
                            header: 'Name', accessor: item => (
                                <div>
                                    <div className="font-bold text-gray-800">{item.name}</div>
                                    <div className="text-xs text-gray-500">{item.role}</div>
                                </div>
                            )
                        },
                        { header: 'Department', accessor: 'department' },
                        { header: 'Points Given', accessor: item => item.pointsGiven.toLocaleString(), className: 'text-right font-bold text-brand-red' },
                        { header: 'Transactions', accessor: 'transactionsCount', className: 'text-right' },
                        { header: 'Avg pts/tx', accessor: item => Math.round(item.averagePoints).toLocaleString(), className: 'text-right' },
                        { header: 'Remaining Quota', accessor: item => item.quotaRemaining.toLocaleString(), className: 'text-right text-gray-400' },
                    ]}
                />
            </div>
        </div>
    );
};
